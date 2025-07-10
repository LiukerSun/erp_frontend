import { ossApi } from '@/services/erp/base';
import { DeleteOutlined, EyeOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Image, Modal, Progress, Upload, message } from 'antd';
import type { UploadFile } from 'antd/es/upload/interface';
import React, { useEffect, useState } from 'react';

interface ImageUploadProps {
  value?: string[];
  onChange?: (urls: string[]) => void;
  maxCount?: number;
  accept?: string;
  listType?: 'picture-card' | 'picture';
  disabled?: boolean;
  showPreview?: boolean;
  showDelete?: boolean;
  uploadText?: string;
  maxSize?: number; // MB
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  value = [],
  onChange,
  maxCount = 5,
  accept = 'image/*',
  listType = 'picture-card',
  disabled = false,
  showPreview = true,
  showDelete = true,
  uploadText = '上传图片',
  maxSize = 5,
}) => {
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewImage, setPreviewImage] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);

  // 将value转换为fileList格式
  useEffect(() => {
    const files = value.map((url, index) => ({
      uid: `-${index}`,
      name: `image-${index}`,
      status: 'done' as const,
      url,
      thumbUrl: url,
    }));
    setFileList(files);
  }, [value]);

  // 上传到OSS
  const uploadToOSS = async (file: File): Promise<string> => {
    try {
      // 获取STS Token
      const stsResponse = await ossApi.getStsToken();
      if (!stsResponse.success) {
        throw new Error('获取上传凭证失败');
      }

      // 获取预签名URL
      const presignedResponse = await ossApi.getPresignedUrl({
        filename: file.name,
        contentType: file.type,
      });

      if (!presignedResponse.success) {
        throw new Error('获取上传URL失败');
      }

      // 上传文件
      const formData = new FormData();
      Object.entries(presignedResponse.data.fields).forEach(([key, value]) => {
        formData.append(key, value);
      });
      formData.append('file', file);

      const uploadResponse = await fetch(presignedResponse.data.url, {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error('文件上传失败');
      }

      // 返回文件URL
      const fileUrl = `${presignedResponse.data.url}/${presignedResponse.data.fields.key}`;
      return fileUrl;
    } catch (error) {
      console.error('Upload error:', error);
      throw new Error('上传失败，请重试');
    }
  };

  // 处理文件上传
  const handleUpload = async (file: File): Promise<boolean> => {
    // 检查文件大小
    if (file.size > maxSize * 1024 * 1024) {
      message.error(`文件大小不能超过 ${maxSize}MB`);
      return false;
    }

    // 检查文件类型
    if (!file.type.startsWith('image/')) {
      message.error('只能上传图片文件');
      return false;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const url = await uploadToOSS(file);

      // 模拟上传进度
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 100;
          }
          return prev + 10;
        });
      }, 100);

      // 更新文件列表
      const newFile: UploadFile = {
        uid: `${Date.now()}-${Math.random()}`,
        name: file.name,
        status: 'done',
        url,
        thumbUrl: url,
      };

      const newFileList = [...fileList, newFile];
      setFileList(newFileList);

      // 触发onChange
      const urls = newFileList.map((f) => f.url || '').filter(Boolean);
      onChange?.(urls);

      message.success('上传成功');
      return true;
    } catch (error) {
      message.error('上传失败');
      return false;
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  // 处理文件删除
  const handleRemove = (file: UploadFile) => {
    const newFileList = fileList.filter((f) => f.uid !== file.uid);
    setFileList(newFileList);

    const urls = newFileList.map((f) => f.url || '').filter(Boolean);
    onChange?.(urls);
  };

  // 处理预览
  const handlePreview = (file: UploadFile) => {
    setPreviewImage(file.url || file.thumbUrl || '');
    setPreviewVisible(true);
  };

  // 上传按钮
  const uploadButton = (
    <div>
      {uploading ? (
        <div style={{ textAlign: 'center' }}>
          <Progress type="circle" percent={uploadProgress} size="small" />
          <div style={{ marginTop: 8 }}>上传中...</div>
        </div>
      ) : (
        <div>
          <PlusOutlined />
          <div style={{ marginTop: 8 }}>{uploadText}</div>
        </div>
      )}
    </div>
  );

  // 自定义操作按钮
  const itemRender = (originNode: React.ReactElement, file: UploadFile) => {
    if (file.status === 'done') {
      return (
        <div style={{ position: 'relative' }}>
          {originNode}
          <div style={{ position: 'absolute', top: 4, right: 4 }}>
            {showPreview && (
              <Button
                type="text"
                size="small"
                icon={<EyeOutlined />}
                onClick={(e) => {
                  e.stopPropagation();
                  handlePreview(file);
                }}
                style={{ color: '#fff', background: 'rgba(0,0,0,0.5)' }}
              />
            )}
            {showDelete && (
              <Button
                type="text"
                size="small"
                icon={<DeleteOutlined />}
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemove(file);
                }}
                style={{ color: '#fff', background: 'rgba(0,0,0,0.5)' }}
              />
            )}
          </div>
        </div>
      );
    }
    return originNode;
  };

  return (
    <>
      <Upload
        listType={listType}
        fileList={fileList}
        customRequest={({ file, onSuccess }) => {
          handleUpload(file as File).then((success) => {
            if (success) {
              onSuccess?.(file);
            }
          });
        }}
        onRemove={handleRemove}
        onPreview={handlePreview}
        disabled={disabled || uploading}
        accept={accept}
        maxCount={maxCount}
        itemRender={itemRender}
        showUploadList={{
          showPreviewIcon: false,
          showRemoveIcon: false,
        }}
      >
        {fileList.length >= maxCount ? null : uploadButton}
      </Upload>

      <Modal
        open={previewVisible}
        title="图片预览"
        footer={null}
        onCancel={() => setPreviewVisible(false)}
      >
        <Image alt="预览" style={{ width: '100%' }} src={previewImage} />
      </Modal>
    </>
  );
};

export default ImageUpload;
